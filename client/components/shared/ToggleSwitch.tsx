import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
    return (
        <div
            onClick={() => { if (!disabled) onChange(!checked); }}
            className={`relative w-[40px] h-[22px] rounded-full transition-colors duration-150 ${checked ? 'bg-[#6366F1]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div
                className={`absolute top-[1px] w-[18px] h-[18px] bg-white rounded-full transition-all duration-150 ease-in-out ${!checked && 'top-[2px]'}`}
                style={{ left: checked ? '20px' : '2px' }}
            />
        </div>
    );
}
