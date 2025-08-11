import * as React from 'react';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

export function Dropdown({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownTrigger must be used within Dropdown');
  
  return (
    <button
      className={className}
      onClick={() => context.setIsOpen(!context.isOpen)}
      onBlur={(e) => {
        // Close dropdown when focus leaves the dropdown area
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setTimeout(() => context.setIsOpen(false), 200);
        }
      }}
    >
      {children}
    </button>
  );
}

export function DropdownContent({ children, className = '', align = 'left' }: { 
  children: React.ReactNode; 
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownContent must be used within Dropdown');
  
  if (!context.isOpen) return null;
  
  const alignmentClass = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }[align];
  
  return (
    <div className={`absolute top-full mt-2 z-50 min-w-[200px] bg-white rounded-lg shadow-xl border border-neutral-200 ${alignmentClass} ${className}`}>
      {children}
    </div>
  );
}

export function DropdownItem({ children, className = '', onClick, href }: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownItem must be used within Dropdown');
  
  const handleClick = () => {
    onClick?.();
    context.setIsOpen(false);
  };
  
  if (href) {
    return (
      <a
        href={href}
        className={`block px-4 py-2 text-sm text-neutral-700 hover:bg-amber-50 hover:text-amber-900 transition-colors ${className}`}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }
  
  return (
    <button
      className={`block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-amber-50 hover:text-amber-900 transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="border-t border-neutral-200 my-1" />;
}