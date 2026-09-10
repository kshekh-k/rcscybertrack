import React, { createContext, useContext, useEffect, useState } from 'react'

export interface BrandConfig {
  brandName: string
  tagline: string
  logoLight: string // Logo image URL for Light Mode
  logoDark: string  // Logo image URL for Dark Mode
  iconLight: string // Icon image URL for Light Mode (collapsed sidebar)
  iconDark: string  // Icon image URL for Dark Mode (collapsed sidebar)
}

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brandName: 'RCS CyberTrack',
  tagline: 'Security Platform',
  logoLight: '/images/rcs-cyber-track-logo-dark.svg',
  logoDark: '/images/rcs-cyber-track-logo-white.svg',
  iconLight: '/images/icon-dark.svg',
  iconDark: '/images/icon-white.svg',
}

interface BrandContextType {
  brand: BrandConfig
  updateBrand: (config: Partial<BrandConfig>) => void
  resetBrand: () => void
  getLogoLight: () => string
  getLogoDark: () => string
  getIconLight: () => string
  getIconDark: () => string
}

const BRAND_STORAGE_KEY = 'cybertrack_brand_config'

const BrandContext = createContext<BrandContextType | undefined>(undefined)

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem(BRAND_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_BRAND_CONFIG, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load brand configuration:', e)
    }
    return DEFAULT_BRAND_CONFIG
  })

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand))
    } catch (e) {
      console.warn('Failed to store brand configuration:', e)
    }
  }, [brand])

  const updateBrand = (newConfig: Partial<BrandConfig>) => {
    setBrand((prev) => ({ ...prev, ...newConfig }))
  }

  const resetBrand = () => {
    setBrand(DEFAULT_BRAND_CONFIG)
  }

  const getLogoLight = () => brand.logoLight || brand.logoDark || DEFAULT_BRAND_CONFIG.logoLight
  const getLogoDark = () => brand.logoDark || brand.logoLight || DEFAULT_BRAND_CONFIG.logoDark

  const getIconLight = () =>
    brand.iconLight || brand.iconDark || brand.logoLight || brand.logoDark || DEFAULT_BRAND_CONFIG.iconLight

  const getIconDark = () =>
    brand.iconDark || brand.iconLight || brand.logoDark || brand.logoLight || DEFAULT_BRAND_CONFIG.iconDark

  return (
    <BrandContext.Provider
      value={{
        brand,
        updateBrand,
        resetBrand,
        getLogoLight,
        getLogoDark,
        getIconLight,
        getIconDark,
      }}
    >
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => {
  const context = useContext(BrandContext)
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}
