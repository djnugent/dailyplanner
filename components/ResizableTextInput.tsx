import React, { useRef, useEffect, TextareaHTMLAttributes, KeyboardEvent, ChangeEvent } from 'react';

interface ResizableTextInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
    onBlur?: (e: any) => void;
    value: string;
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}

export const ResizableTextInput: React.FC<ResizableTextInputProps> = ({
    className,
    onBlur,
    value,
    onChange,
    placeholder
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const resizeTextarea = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        resizeTextarea();
        if (onChange) {
            onChange(e);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.blur();
            }
        }
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
        if (onBlur) {
            onBlur(event);
        }
    };

    useEffect(() => {
        resizeTextarea();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            className={className}
            style={{ resize: 'none' }}
            placeholder={placeholder}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            rows={1}
        />
    );
};
