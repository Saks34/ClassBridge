export default function LoadingSpinner({ size = 'md', centered = false }) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-[3px]',
        lg: 'w-12 h-12 border-4',
    };

    const spinner = (
        <div
            className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
        />
    );

    if (centered) {
        return (
            <div className="flex items-center justify-center p-8">
                {spinner}
            </div>
        );
    }

    return spinner;
}
