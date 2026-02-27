import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso))
}

export function formatSalaryLPA(lpa: number): string {
    if (lpa >= 100) return `${(lpa / 100).toFixed(1)}Cr`
    return `${lpa}L`
}
