import crypto from 'crypto';

export const createRefreshToken = () => {
  try {
    const current_date = new Date().valueOf.toString();
    const random = Math.random().toString();
    const rfToken = crypto
      .createHash('sha1')
      .update(current_date + random)
      .digest('hex');

    const rfExpiry = new Date();
    rfExpiry.setUTCDate(rfExpiry.getUTCDate() + 100);

    return { value: rfToken, expiry: rfExpiry };
  } catch (err) {
    throw new Error('Could not create refresh token');
  }
};
