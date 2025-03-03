export interface PaymentProps {
    amount: number;
    description: string;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
}

export interface PesaPalResponse {
    order_tracking_id: string;
    merchant_reference: string;
    redirect_url: string;
    error: string | null;
    status: string;
}
