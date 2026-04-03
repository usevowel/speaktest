/**
 * AI Code Block Component
 * Syntax-highlighted code blocks with copy buttons for AI responses.
 * Based on shadcn AI Elements code-block component.
 */

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Props for CodeBlock component
 */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Code content to display */
  code: string
  /** Programming language for syntax highlighting */
  language: string
  /** Display line numbers */
  showLineNumbers?: boolean
  /** Optional elements (like copy button) */
  children?: React.ReactNode
}

/**
 * CodeBlock Component
 * Container for syntax-highlighted code display with dark branded colors
 */
export function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  children,
  className,
  ...props
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden w-full h-full',
        className
      )}
      style={{ 
        backgroundColor: '#1F2937',
        margin: 0,
        padding: 0,
      }}
      {...props}
    >
      <div className="relative w-full h-full" style={{ margin: 0, padding: 0 }}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            paddingTop: '1.5rem',
            paddingLeft: '3rem',
            paddingRight: '1rem',
            paddingBottom: '1rem',
            background: 'transparent',
            fontSize: '24px',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            width: '100%',
            height: '100%',
          }}
          codeTagProps={{
            style: {
              fontSize: '24px',
              lineHeight: '1.0',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            }
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: '#6b7280',
            userSelect: 'none',
            fontSize: '24px',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      {children && (
        <div className="absolute top-2 right-2">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Props for CodeBlockCopyButton component
 */
export interface CodeBlockCopyButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'onError'> {
  /** Callback after successful copy */
  onCopy?: () => void
  /** Error handler for copy failure */
  onError?: (error: Error) => void
  /** Duration to show success state (ms) */
  timeout?: number
  /** Code to copy */
  code?: string
}

/**
 * CodeBlockCopyButton Component
 * Copy button with automatic clipboard integration
 */
export function CodeBlockCopyButton({
  onCopy,
  onError,
  timeout = 2000,
  code = '',
  className,
  ...props
}: CodeBlockCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      onCopy?.()
      setTimeout(() => {
        setCopied(false)
      }, timeout)
    } catch (error) {
      onError?.(error as Error)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      size="sm"
      variant="ghost"
      className={cn(
        'h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800',
        className
      )}
      {...props}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </Button>
  )
}

