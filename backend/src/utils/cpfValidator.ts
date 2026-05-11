/**
 * Valida CPF usando o algoritmo oficial de dígitos verificadores.
 */
export function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, "");

  if (nums.length !== 11) return false;

  // Rejeitar CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(nums)) return false;

  // Validar primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(nums[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(nums[9])) return false;

  // Validar segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(nums[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(nums[10])) return false;

  return true;
}
