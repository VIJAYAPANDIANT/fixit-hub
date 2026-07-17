import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

describe('CodeBlock Component', () => {
  const code = 'const x = 42;';
  const language = 'typescript';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders code snippet and language label correctly', () => {
    render(<CodeBlock code={code} language={language} />);

    expect(screen.getByText(language)).toBeInTheDocument();
    expect(screen.getByText(code)).toBeInTheDocument();
  });

  it('handles default language fallback', () => {
    render(<CodeBlock code={code} />);

    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('copies code to clipboard and updates button text when clicked', async () => {
    render(<CodeBlock code={code} language={language} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toBeInTheDocument();

    // Click to copy
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);

    // Wait for the async state change to complete using findByText
    const copiedText = await screen.findByText('Copied!');
    expect(copiedText).toBeInTheDocument();

    // Wait for the "Copied!" text to reset back to "Copy" (takes 2000ms in CodeBlock)
    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});
