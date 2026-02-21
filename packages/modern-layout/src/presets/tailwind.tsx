import type { LayoutComponentPreset } from '../types';

/**
 * Tailwind CSS Component Preset for Modern Layout
 *
 * A minimal, unstyled preset that uses Tailwind CSS classes.
 * Perfect for projects that want full control over styling without Mantine.
 */
export const tailwindPreset: LayoutComponentPreset = {
    Box: ({ children, className = '', style, onClick, onMouseEnter, onMouseLeave, onMouseDown, ref, ...props }) => (
        <div
            ref={ref}
            className={className}
            style={style}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            {...props}
        >
            {children}
        </div>
    ),

    IconButton: ({ icon, onClick, isActive, disabled, size = 'md', tooltip, className = '', 'aria-label': ariaLabel }) => {
        const sizes = {
            sm: 'p-1',
            md: 'p-2',
            lg: 'p-3',
        };

        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel || (typeof tooltip === 'string' ? tooltip : undefined)}
                className={`
                    inline-flex items-center justify-center rounded-md transition-colors
                    ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${sizes[size]}
                    ${className}
                `}
                title={typeof tooltip === 'string' ? tooltip : undefined}
            >
                {icon}
            </button>
        );
    },

    Tooltip: ({ children, label, position = 'top', disabled }) => {
        if (disabled) return <>{children}</>;
        // Minimal CSS-only tooltip or just a title attribute for simplicity in this preset
        return (
            <div className="relative group inline-block">
                {children}
                <div className={`
                    absolute z-50 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-sm whitespace-nowrap
                    ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
                    ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
                    ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
                    ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
                `}>
                    {label}
                </div>
            </div>
        );
    },

    Drawer: ({ children, isOpen, onClose, position = 'right', size = 320, title }) => {
        if (!isOpen) return null;

        const positionClasses = {
            left: 'left-0 h-full border-r',
            right: 'right-0 h-full border-l',
            top: 'top-0 w-full border-b',
            bottom: 'bottom-0 w-full border-t',
        };

        const sizeStyle = (position === 'left' || position === 'right')
            ? { width: size }
            : { height: size };

        return (
            <div className="fixed inset-0 z-50 flex">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div
                    className={`absolute bg-white flex flex-col shadow-xl ${positionClasses[position]}`}
                    style={sizeStyle}
                >
                    {title && (
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold">{title}</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                    )}
                    <div className="flex-1 overflow-auto">{children}</div>
                </div>
            </div>
        );
    },

    Divider: ({ orientation = 'horizontal', className = '' }) => (
        <div className={`${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'} bg-gray-200 ${className}`} />
    ),

    Badge: ({ children, variant = 'default', className = '' }) => {
        const variants = {
            default: 'bg-gray-100 text-gray-800',
            primary: 'bg-indigo-100 text-indigo-700',
            secondary: 'bg-purple-100 text-purple-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
                {children}
            </span>
        );
    },

    ScrollArea: ({ children, maxHeight, className = '', style }) => (
        <div
            className={`overflow-auto ${className}`}
            style={{ maxHeight, ...style }}
        >
            {children}
        </div>
    ),

    AppShell: ({ children, header, navbar, footer, padding = 0 }) => (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            {header && <header className="flex-shrink-0 z-30">{header}</header>}
            <div className="flex flex-1 overflow-hidden">
                {navbar && <nav className="flex-shrink-0 z-20">{navbar}</nav>}
                <main className="flex-1 overflow-auto relative" style={{ padding }}>
                    {children}
                </main>
            </div>
            {footer && <footer className="flex-shrink-0 z-10">{footer}</footer>}
        </div>
    ),

    Modal: ({ children, isOpen, onClose, title, centered = true }) => {
        if (!isOpen) return null;
        return (
            <div className={`fixed inset-0 z-50 flex p-4 ${centered ? 'items-center justify-center' : 'items-start justify-center'}`}>
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
                    {title && (
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-lg">{title}</h3>
                            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                        </div>
                    )}
                    <div className="p-6 flex-1 overflow-auto">{children}</div>
                </div>
            </div>
        );
    },

    Skeleton: ({ width, height, circle, radius, className = '', style }) => (
        <div
            className={`bg-gray-200 animate-pulse ${circle ? 'rounded-full' : ''} ${className}`}
            style={{
                width,
                height,
                borderRadius: radius,
                ...style
            }}
        />
    ),

    Overlay: ({ opacity = 0.5, blur = 0, zIndex = 10, onClick, children }) => (
        <div
            onClick={onClick}
            className="absolute inset-0 flex items-center justify-center"
            style={{
                backgroundColor: `rgba(0,0,0,${opacity})`,
                backdropFilter: blur ? `blur(${blur}px)` : undefined,
                zIndex
            }}
        >
            {children}
        </div>
    ),

    Input: ({ value, onChange, placeholder, label, description, error, disabled, type = 'text', leftSection, rightSection, className = '' }) => (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            {description && <p className="text-xs text-gray-500">{description}</p>}
            <div className="relative flex items-center">
                {leftSection && <div className="absolute left-3">{leftSection}</div>}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`
                        w-full rounded-md border text-sm transition-shadow
                        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}
                        ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white'}
                        ${leftSection ? 'pl-10' : 'px-3'}
                        ${rightSection ? 'pr-10' : 'px-3'}
                        py-2 focus:ring-2 focus:ring-offset-0 focus:outline-none
                    `}
                />
                {rightSection && <div className="absolute right-3">{rightSection}</div>}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    ),

    Header: ({ children, height, className = '', style }) => (
        <div
            className={`border-b bg-white flex items-center px-4 ${className}`}
            style={{ height, ...style }}
        >
            {children}
        </div>
    ),

    Footer: ({ children, height, className = '', style }) => (
        <div
            className={`border-t bg-gray-50 flex items-center px-4 ${className}`}
            style={{ height, ...style }}
        >
            {children}
        </div>
    ),

    Text: ({ children, size = 'md', weight, bold, color, align, className = '', style, transform, lineHeight }) => {
        const sizes = {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
        };
        const aligns = {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        };

        return (
            <p
                className={`
                    ${sizes[size]} 
                    ${align ? aligns[align] : ''} 
                    ${bold ? 'font-bold' : ''} 
                    ${className}
                `}
                style={{
                    fontWeight: weight,
                    color,
                    textTransform: transform,
                    lineHeight,
                    ...style
                }}
            >
                {children}
            </p>
        );
    },

    Button: ({ children, onClick, variant = 'primary', size = 'md', disabled, loading, fullWidth, leftSection, rightSection, className = '', style, type = 'button' }) => {
        const variants = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
            secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
            danger: 'bg-red-600 text-white hover:bg-red-700',
            light: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
            subtle: 'text-gray-600 hover:bg-gray-100',
        };

        const sizes = {
            xs: 'px-2 py-1 text-xs',
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        };

        return (
            <button
                type={type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button'}
                onClick={onClick}
                disabled={disabled || loading}
                className={`
                    inline-flex items-center justify-center rounded-md font-medium transition-colors gap-2
                    ${variants[variant]}
                    ${sizes[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${className}
                `}
                style={style}
            >
                {loading ? '...' : (
                    <>
                        {leftSection && <span>{leftSection}</span>}
                        {children}
                        {rightSection && <span>{rightSection}</span>}
                    </>
                )}
            </button>
        );
    },
};
