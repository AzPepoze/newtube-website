export type ModalType = 'error' | 'warning' | 'info' | 'success';

interface ModalState {
    show: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
}

const createUiState = () => {
    let modal = $state<ModalState>({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: undefined
    });

    return {
        get modal() { return modal; },
        showModal(title: string, message: string, type: ModalType = 'error', onConfirm?: () => void) {
            modal.show = true;
            modal.title = title;
            modal.message = message;
            modal.type = type;
            modal.onConfirm = onConfirm;
        },
        closeModal() {
            modal.show = false;
        }
    };
};

export const ui = createUiState();
