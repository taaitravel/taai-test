import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UploadErrorAlert } from './UploadErrorAlert';

afterEach(() => cleanup());

describe('UploadErrorAlert', () => {
  it('shows a title, an explanation, and a single OK button', () => {
    const onDismiss = vi.fn();
    render(
      <UploadErrorAlert
        notice={{
          title: 'This Chat Is Full',
          message: 'A trip chat can hold 20 photos and files. Remove one, then try again.',
        }}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('This Chat Is Full')).toBeTruthy();
    expect(screen.getByText(/Remove one, then try again/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('stays closed when there is nothing to report', () => {
    render(<UploadErrorAlert notice={null} onDismiss={() => undefined} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
