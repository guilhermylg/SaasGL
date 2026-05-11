import rateLimit from "express-rate-limit";

// Limita formulário de inscrição: 5 tentativas por IP a cada 15 min
export const inscricaoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde 15 minutos." },
});

// Limita login: 5 tentativas por IP a cada 15 min
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." },
});

// Limite geral de API
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de requisições excedido." },
});
