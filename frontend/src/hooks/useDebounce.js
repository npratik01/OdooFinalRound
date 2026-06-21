import { useState, useEffect } from 'react'

/**
 * useDebounce – delays updating the returned value until the input value
 * has not changed for `delay` ms.
 *
 * @param {*}      value  - The value to debounce.
 * @param {number} delay  - Delay in milliseconds (default 600ms).
 * @returns The debounced value.
 */
const useDebounce = (value, delay = 600) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
