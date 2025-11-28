export const maskPhone = (value: string) => {
  if (!value) return "";

  // Remove non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 11 digits
  const limitedDigits = digits.slice(0, 11);

  // Apply mask (99) 9 9999-9999
  return limitedDigits
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
};

export const maskCPF = (value: string) => {
  if (!value) return "";

  // Remove non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 11 digits
  const limitedDigits = digits.slice(0, 11);

  // Apply mask 999.999.999-99
  return limitedDigits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const unmask = (value: string) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

export const maskCNPJ = (value: string) => {
  if (!value) return "";

  // Remove non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 14 digits
  const limitedDigits = digits.slice(0, 14);

  // Apply mask 00.000.000/0000-00
  return limitedDigits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};
