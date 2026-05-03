export const formatFullName = (user: { firstName: string; lastName: string } | null | undefined): string => {
    if (!user) {
        return '';
    }
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
};

export const toPersianDigits = (n: string | number | undefined | null): string => {
    if (n === null || n === undefined) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/[0-9]/g, (w) => persianDigits[+w]);
};
