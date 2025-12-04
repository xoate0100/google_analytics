/**
 * Metrics collection system
 * Provides counter, histogram, and gauge metrics with export functionality
 */

/**
 * Counter metric interface
 */
export interface ICounter {
  inc(value?: number): void;
  get(): number;
  reset(): void;
}

/**
 * Histogram metric interface
 */
export interface IHistogram {
  observe(value: number): void;
  getStats(): HistogramStats;
  reset(): void;
}

/**
 * Histogram statistics
 */
export interface HistogramStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Gauge metric interface
 */
export interface IGauge {
  set(value: number): void;
  inc(value?: number): void;
  dec(value?: number): void;
  get(): number;
  reset(): void;
}

/**
 * Counter metric options
 */
export interface CounterOptions {
  collector?: MetricsCollector;
  labels?: Record<string, string>;
}

/**
 * Histogram metric options
 */
export interface HistogramOptions {
  collector?: MetricsCollector;
  buckets?: number[];
  labels?: Record<string, string>;
}

/**
 * Gauge metric options
 */
export interface GaugeOptions {
  collector?: MetricsCollector;
  labels?: Record<string, string>;
}

/**
 * Exported counter metric
 */
export interface ExportedCounter {
  name: string;
  description: string;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Exported histogram metric
 */
export interface ExportedHistogram {
  name: string;
  description: string;
  stats: HistogramStats;
  labels?: Record<string, string>;
}

/**
 * Exported gauge metric
 */
export interface ExportedGauge {
  name: string;
  description: string;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Exported metrics
 */
export interface ExportedMetrics {
  counters: ExportedCounter[];
  histograms: ExportedHistogram[];
  gauges: ExportedGauge[];
}

/**
 * Counter metric implementation
 */
class Counter implements ICounter {
  private value = 0;
  private readonly name: string;
  private readonly description: string;
  private readonly labels?: Record<string, string>;
  private readonly collector?: MetricsCollector;

  constructor(
    name: string,
    description: string,
    options: CounterOptions = {}
  ) {
    this.name = name;
    this.description = description;
    this.labels = options.labels;
    this.collector = options.collector;
    this.collector?.registerCounter(this);
  }

  inc(value = 1): void {
    this.value += value;
  }

  get(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getLabels(): Record<string, string> | undefined {
    return this.labels;
  }

  export(): ExportedCounter {
    return {
      name: this.name,
      description: this.description,
      value: this.value,
      labels: this.labels,
    };
  }
}

/**
 * Histogram metric implementation
 */
class Histogram implements IHistogram {
  private values: number[] = [];
  private readonly name: string;
  private readonly description: string;
  private readonly labels?: Record<string, string>;
  private readonly collector?: MetricsCollector;

  constructor(
    name: string,
    description: string,
    options: HistogramOptions = {}
  ) {
    this.name = name;
    this.description = description;
    this.labels = options.labels;
    this.collector = options.collector;
    this.collector?.registerHistogram(this);
  }

  observe(value: number): void {
    this.values.push(value);
  }

  getStats(): HistogramStats {
    if (this.values.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...this.values].sort((a, b) => a - b);
    const sum = this.values.reduce((acc, val) => acc + val, 0);
    const mean = sum / this.values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const p50 = this.percentile(sorted, 50);
    const p95 = this.percentile(sorted, 95);
    const p99 = this.percentile(sorted, 99);

    return {
      count: this.values.length,
      sum,
      min,
      max,
      mean,
      p50,
      p95,
      p99,
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) {
      return 0;
    }
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  reset(): void {
    this.values = [];
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getLabels(): Record<string, string> | undefined {
    return this.labels;
  }

  export(): ExportedHistogram {
    return {
      name: this.name,
      description: this.description,
      stats: this.getStats(),
      labels: this.labels,
    };
  }
}

/**
 * Gauge metric implementation
 */
class Gauge implements IGauge {
  private value = 0;
  private readonly name: string;
  private readonly description: string;
  private readonly labels?: Record<string, string>;
  private readonly collector?: MetricsCollector;

  constructor(name: string, description: string, options: GaugeOptions = {}) {
    this.name = name;
    this.description = description;
    this.labels = options.labels;
    this.collector = options.collector;
    this.collector?.registerGauge(this);
  }

  set(value: number): void {
    this.value = value;
  }

  inc(value = 1): void {
    this.value += value;
  }

  dec(value = 1): void {
    this.value -= value;
  }

  get(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getLabels(): Record<string, string> | undefined {
    return this.labels;
  }

  export(): ExportedGauge {
    return {
      name: this.name,
      description: this.description,
      value: this.value,
      labels: this.labels,
    };
  }
}

/**
 * Metrics collector
 * Central registry for all metrics
 */
export class MetricsCollector {
  private counters: Counter[] = [];
  private histograms: Histogram[] = [];
  private gauges: Gauge[] = [];

  registerCounter(counter: Counter): void {
    this.counters.push(counter);
  }

  registerHistogram(histogram: Histogram): void {
    this.histograms.push(histogram);
  }

  registerGauge(gauge: Gauge): void {
    this.gauges.push(gauge);
  }

  export(): ExportedMetrics {
    return {
      counters: this.counters.map((c) => c.export()),
      histograms: this.histograms.map((h) => h.export()),
      gauges: this.gauges.map((g) => g.export()),
    };
  }

  clear(): void {
    this.counters = [];
    this.histograms = [];
    this.gauges = [];
  }
}

/**
 * Create a counter metric
 */
export function createCounter(
  name: string,
  description: string,
  options: CounterOptions = {}
): ICounter {
  return new Counter(name, description, options);
}

/**
 * Create a histogram metric
 */
export function createHistogram(
  name: string,
  description: string,
  options: HistogramOptions = {}
): IHistogram {
  return new Histogram(name, description, options);
}

/**
 * Create a gauge metric
 */
export function createGauge(
  name: string,
  description: string,
  options: GaugeOptions = {}
): IGauge {
  return new Gauge(name, description, options);
}

