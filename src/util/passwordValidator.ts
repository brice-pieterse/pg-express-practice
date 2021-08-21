// password must contain atleast 1 number
const validatePass = (pw: string) => {
  if (pw.length < 7) {
    return false;
  }
  for (let i = 0; i < pw.length; i++) {
    if (parseInt(pw[i])) {
      return true;
    }
  }
};

export default validatePass;
