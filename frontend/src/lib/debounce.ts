/**
 * Creates a debounced function that delays invocation until after
 * wait milliseconds have elapsed since the last time it was called.
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function debounced(...args: Parameters<T>) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			func(...args);
			timeout = null;
		}, wait);
	};
}
