import React from 'react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function CustomCheckbox({
  checked,
  onChange,
  color = '#1890ff',
  disabled = false,
  style,
  className
}: CustomCheckboxProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    border: `2px solid ${color}`,
    borderRadius: '2px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: checked ? color : 'transparent',
    transition: 'all 0.2s ease',
    position: 'relative',
    ...style
  };

  return (
    <div
      className={className}
      style={checkboxStyle}
      onClick={handleClick}
    >
      {checked && (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
