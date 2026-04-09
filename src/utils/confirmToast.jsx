import toast from 'react-hot-toast';

/**
 * Shows a toast-based confirmation prompt.
 * @param {string} message - The confirmation message to display.
 * @param {object} options
 * @param {string} [options.confirmLabel='Delete'] - Label for the confirm button.
 * @param {string} [options.cancelLabel='Cancel'] - Label for the cancel button.
 * @param {'danger'|'warning'|'info'} [options.variant='danger'] - Visual variant.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled.
 */
/**
 * Shows a toast-based confirmation prompt.
 * @param {string} message - The confirmation message to display.
 * @param {object} options 
 * @param {string} [options.confirmLabel='Confirm'] - Label for the primary action.
 * @param {string} [options.cancelLabel='Cancel'] - Label for the secondary action.
 * @param {'danger'|'warning'|'info'|'primary'|'secondary'} [options.variant='primary'] - Visual variant for the primary button.
 * @param {Array<{label: string, result: any, variant?: string, icon?: string}>} [options.buttons] - Custom buttons array. If provided, overrides labels.
 * @returns {Promise<any>} Resolves to the result of the clicked button.
 */
export function confirmToast(message, {
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    buttons = null
} = {}) {
    return new Promise((resolve) => {
        const buttonStyles = {
            danger: {
                bg: 'var(--error)',
                hover: 'var(--error-container)',
                text: 'var(--on-error)',
                icon: '🗑️'
            },
            warning: {
                bg: 'var(--warning, #f59e0b)',
                hover: '#d97706',
                text: 'var(--on-warning, #000)',
                icon: '⚠️'
            },
            info: {
                bg: 'var(--secondary)',
                hover: 'var(--secondary-container)',
                text: 'var(--on-secondary)',
                icon: 'ℹ️'
            },
            primary: {
                bg: 'var(--primary)',
                hover: 'var(--primary-container)',
                text: 'var(--on-primary)',
                icon: '✨'
            },
            secondary: {
                bg: 'var(--secondary)',
                hover: 'var(--secondary-container)',
                text: 'var(--on-secondary)',
                icon: '💠'
            },
            cancel: {
                bg: 'var(--surface-container-high)',
                hover: 'var(--surface-container-highest)',
                text: 'var(--on-surface-variant)',
                icon: ''
            }
        };

        // Default buttons if none provided
        const displayButtons = buttons || [
            { label: cancelLabel, result: false, variant: 'cancel' },
            { label: confirmLabel, result: true, variant: variant }
        ];

        const mainIcon = buttonStyles[variant]?.icon || '❓';

        toast(
            (t) => (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    minWidth: '280px',
                    animation: 'toast-in 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{mainIcon}</span>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--on-surface)', fontWeight: 600, lineHeight: 1.4 }}>
                            {message}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        {displayButtons.map((btn, idx) => {
                            const style = buttonStyles[btn.variant] || buttonStyles.primary;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        resolve(btn.result);
                                    }}
                                    className="confirm-toast-btn"
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        border: btn.variant === 'cancel' ? '1px solid var(--outline-variant)' : 'none',
                                        background: style.bg,
                                        color: style.text,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {btn.icon && <span>{btn.icon}</span>}
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ),
            {
                duration: 8000,
                style: {
                    background: 'var(--surface-container-highest)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: '24px',
                    padding: '20px',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                    color: 'var(--on-surface)',
                    backdropFilter: 'blur(30px)',
                    maxWidth: '400px'
                },
                position: 'top-center',
            }
        );
    });
}

