import { EntrevistaPolitica, RespostaIA } from './ai';
import { ValidationResult } from './policy';
import crypto from 'crypto';

interface CacheEntry {
  hash: string;
  resultado: RespostaIA;
  validation: ValidationResult;
  timestamp: number;
  ttl: number;
}

class PolicyCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutos

  generateHash(entrevista: EntrevistaPolitica): string {
    // Normalizar a entrevista para gerar hash consistente
    const normalized = this.normalizeEntrevista(entrevista);
    return crypto
      .createHash('md5')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  private normalizeEntrevista(
    entrevista: EntrevistaPolitica
  ): EntrevistaPolitica {
    // Normalizar strings para evitar diferenças de capitalização/whitespace
    const normalized: EntrevistaPolitica = {};

    Object.entries(entrevista).forEach(([key, value]) => {
      if (typeof value === 'string') {
        normalized[key as keyof EntrevistaPolitica] = value
          .trim()
          .toLowerCase();
      } else {
        normalized[key as keyof EntrevistaPolitica] = value;
      }
    });

    return normalized;
  }

  get(hash: string): CacheEntry | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(hash);
      return null;
    }

    return entry;
  }

  set(hash: string, resultado: RespostaIA, validation: ValidationResult): void {
    this.cache.set(hash, {
      hash,
      resultado,
      validation,
      timestamp: Date.now(),
      ttl: this.TTL,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Método para limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [hash, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(hash);
      }
    }
  }

  // Método para obter estatísticas do cache
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Implementar tracking de hit rate se necessário
    };
  }
}

// Instância singleton do cache
export const policyCache = new PolicyCache();

// Limpar cache expirado a cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(
    () => {
      policyCache.cleanup();
    },
    5 * 60 * 1000
  );
}
