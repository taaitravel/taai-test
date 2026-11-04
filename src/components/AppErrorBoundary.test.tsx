import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

const Boom = () => {
  throw new Error('dashboard blew up');
};

describe('AppErrorBoundary', () => {
  it('logs a render error and shows a way back', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('alert').textContent).toContain('This page ran into a problem');
    expect(error).toHaveBeenCalledWith(
      'app encountered an error',
      expect.objectContaining({ message: 'dashboard blew up' }),
    );
    error.mockRestore();
  });
});
