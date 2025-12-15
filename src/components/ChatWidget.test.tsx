import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import {act} from 'react-dom/test-utils';

import {ChatWidget, WidgetController} from '../index';
import store from '../storage';

const mockSuccessResponse = (reply: string) =>
  new Response(JSON.stringify({reply}), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });

describe('ChatWidget', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('responds to open/close/toggle controller events', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockSuccessResponse('ok'));
    (global as any).fetch = fetchMock;

    const {container} = render(
      <ChatWidget tenantId='t-controller' aiEndpoint='/mock' hideToggleButton />
    );
    const panel = container.querySelector(
      '.ai-light__chat-window-container'
    ) as HTMLElement;

    expect(panel.style.height).toBe('0px');

    await act(async () => WidgetController.open());
    expect(panel.style.height).not.toBe('0px');

    await act(async () => WidgetController.close());
    expect(panel.style.height).toBe('0px');

    await act(async () => WidgetController.toggle());
    expect(panel.style.height).not.toBe('0px');
  });

  it('retries with backoff and renders AI reply', async () => {
    let postCalls = 0;
    const fetchMock = jest.fn((_, options) => {
      const method = (options as any)?.method;
      if (method === 'HEAD') {
        return Promise.resolve(mockSuccessResponse('ok'));
      }
      postCalls += 1;
      if (postCalls === 1) {
        return Promise.reject(new Error('network'));
      }
      return Promise.resolve(mockSuccessResponse('hello back'));
    });
    (global as any).fetch = fetchMock;

    render(
      <ChatWidget
        tenantId='t-retry'
        aiEndpoint='/mock'
        isOpenByDefault
        primaryColor='#123456'
        hideToggleButton
      />
    );

    const input = screen.getByLabelText('Chat message') as HTMLTextAreaElement;
    fireEvent.change(input, {target: {value: 'hello'}});
    fireEvent.keyDown(input, {key: 'Enter', code: 'Enter'});

    expect(await screen.findByText('hello back')).toBeTruthy();
    expect(screen.getByText('hello')).toBeTruthy();
    expect(postCalls).toBe(2);
  });

  it('shows fallback reply when backend unreachable', async () => {
    let postCalls = 0;
    const fetchMock = jest.fn((_, options) => {
      const method = (options as any)?.method;
      if (method === 'HEAD') {
        return Promise.resolve(mockSuccessResponse('ok'));
      }
      postCalls += 1;
      return Promise.reject(new Error('offline'));
    });
    (global as any).fetch = fetchMock;

    render(
      <ChatWidget
        tenantId='t-fallback'
        aiEndpoint='/mock'
        isOpenByDefault
        hideToggleButton
      />
    );

    const input = screen.getByLabelText('Chat message') as HTMLTextAreaElement;
    fireEvent.change(input, {target: {value: 'anyone there?'}});
    fireEvent.keyDown(input, {key: 'Enter', code: 'Enter'});

    const fallback = await screen.findByText(
      'I am having trouble reaching the server right now.'
    );
    expect(fallback).toBeTruthy();
    expect(postCalls).toBe(3);
  });

  it('warns and renders nothing for invalid props', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const {container} = render(
      <ChatWidget tenantId='' aiEndpoint='' hideToggleButton />
    );

    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('caps transcripts at 200 messages and recovers safely', () => {
    const memoryStore = store(undefined);
    const messages = Array.from({length: 250}).map((_, idx) => ({
      id: `m-${idx}`,
      author: 'user',
      text: `message-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    memoryStore.setTranscript('tenant', messages as any);
    const recovered = memoryStore.getTranscript('tenant');

    expect(recovered.length).toBe(200);
    expect(recovered[0].id).toBe('m-50');
    expect(recovered[199].id).toBe('m-249');
  });

  it('isolates open state per tenant and resets corrupted JSON', () => {
    const browserStore = store(window);
    browserStore.setOpenState('tenant-one', true);
    browserStore.setOpenState('tenant-two', false);

    expect(browserStore.getOpenState('tenant-one')).toBe(true);
    expect(browserStore.getOpenState('tenant-two')).toBe(false);

    window.sessionStorage.setItem(
      '__AI_LIGHT__[tenant-one].open',
      'not-json-value'
    );

    expect(browserStore.getOpenState('tenant-one')).toBeNull();
  });
});
