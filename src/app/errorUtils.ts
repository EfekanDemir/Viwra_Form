export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'İnternet bağlantınızı kontrol edin.';
    }
    if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('rls')) {
      return 'Bu işlem için yetkiniz yok.';
    }
    if (msg.includes('quota') || msg.includes('rate limit')) {
      return 'Çok fazla istek gönderildi. Lütfen bekleyin.';
    }
  }
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
};
