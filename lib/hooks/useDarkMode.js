"use client"
import { useEffect, useState } from "react"

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)'
      document.documentElement.style.transition = 'filter 0.3s'
      setIsDark(true)
    } else {
      document.documentElement.style.filter = 'none'
      setIsDark(false)
    }
  }, [])

  const toggle = () => {
    const newVal = !isDark
    if (newVal) {
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)'
      document.documentElement.style.transition = 'filter 0.3s'
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.style.filter = 'none'
      localStorage.setItem("theme", "light")
    }
    setIsDark(newVal)
    window.dispatchEvent(new Event("darkModeChange"))
  }

  return { isDark, toggle }
}