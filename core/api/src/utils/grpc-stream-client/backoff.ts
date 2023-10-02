/**
 * FibonacciBackoff generates a series based on the Fibonacci sequence
 * up to a certain limit. After the limit is reached, it will continue
 * to return the last number.
 *
 * The calculation-specification is:
 *          backOff = F(n) where n is the nth number in the Fibonacci sequence.
 *
 * Example: for initial=100, fibMaxIndex=7 the FibonacciBackoff will pro-
 * duce the backOff-series [100, 200, 300, 500, 800, 1300, 2100].
 */
export class FibonacciBackoff implements BaseBackOff {
  private readonly initial: number
  private readonly fibMaxIndex: number
  private index: number
  private current: number
  private previous: number

  /**
   * Constructor
   * @param initial milliseconds
   * @param fibMaxIndex number
   */
  constructor(initial: number, fibMaxIndex: number) {
    this.initial = initial
    this.fibMaxIndex = fibMaxIndex
    this.index = 0
    this.current = this.initial
    this.previous = 0
  }

  next(): number {
    if (this.index < this.fibMaxIndex) {
      const next = this.previous + this.current
      this.previous = this.current
      this.current = next
      this.index++
    }
    return this.current
  }

  reset() {
    this.index = 0
    this.current = this.initial
    this.previous = 0
  }
}
