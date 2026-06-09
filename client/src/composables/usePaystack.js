export const usePaystack = () => {
  const pay = ({ key, email, amount, reference, metadata, onSuccess, onClose }) => {
    if (!window.PaystackPop) {
      console.error('Paystack script not loaded')
      return
    }
    const handler = window.PaystackPop.setup({
      key, email,
      amount: Math.round(amount * 100),
      currency: 'NGN',
      ref: reference,
      metadata,
      callback: (response) => onSuccess && onSuccess(response),
      onClose:  ()         => onClose  && onClose()
    })
    handler.openIframe()
  }
  return { pay }
}
