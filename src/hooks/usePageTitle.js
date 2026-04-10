import { useEffect } from 'react';

/**
 * Custom hook to set page title dynamically
 * @param {string} title - The page title
 * @param {string} role - Optional user role to append
 */
export function usePageTitle(title, role = '') {
    useEffect(() => {
        const prevTitle = document.title;
        const rolePrefix = role ? `${role} | ` : '';
        document.title = `${rolePrefix}${title} - ClassBridge`;

        return () => {
            document.title = prevTitle;
        };
    }, [title, role]);
}

export default usePageTitle;
