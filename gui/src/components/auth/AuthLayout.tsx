import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import { useBrand } from '../../lib/brand'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme()
  const { brand, getLogoLight, getLogoDark } = useBrand()

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      {/* Full Viewport Cybersecurity Background Image */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <img
          src="images/login-bg-dark.png"
          alt="background image"
          className="object-cover size-full max-w-none grayscale-100 dark:grayscale-0"
        />
      </div>

      {/* Background Overlay for form legibility */}
      <div className="absolute inset-0 z-0 bg-gray-100/90 dark:bg-slate-950/90 transition-colors duration-300" />

      {/* Foreground Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col w-full">
        <div className="flex lex-wrap flex-1 w-full">
          <div className="flex justify-center items-center h-ful w-3/5 relative after:absolute dark:after:bg-slate-950/60  after:bg-slate-950/40 after:inset-0" >

            <div className='overflow-hidden bg-linear-to-br from-blue-500 to-cyan-500 shadow-1 max-h-screen'><img src="/images/dashboard-login-image-v3.png" className='object-cover' /></div>

          </div>
          <div className="flex justify-center items-center p-8 w-1/2">
            <div className="w-full max-w-115 flex flex-col items-center justify-center">
              {/* Floating Authentication Card */}
              <div className="w-full max-w-115 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-xl p-5 xl:p-8 shadow-1 relative overflow-hidden transition-all duration-300">
                {/* Top Gradient Accent Line */}
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent dark:via-cyan-400 via-blue-500 to-transparent"></div>

                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  className="absolute top-5 z-10 right-5 p-2 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <Sun className="size-4 text-white" />
                  ) : (
                    <Moon className="size-4 text-slate-700" />
                  )}
                </button>

                {children}
              </div>

              {/* Enterprise Version & Footer Text */}
              <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Powered by {brand.brandName}</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <a
                  href="https://rcsinfratech.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center cursor-pointer"
                  title={`Visit ${brand.brandName}`}
                >
                  <img
                    src={getLogoLight()}
                    alt={`${brand.brandName} Logo`}
                    className="h-5 w-auto block dark:hidden opacity-90 hover:opacity-100 transition-opacity object-contain"
                  />
                  <img
                    src={getLogoDark()}
                    alt={`${brand.brandName} Logo`}
                    className="h-5 w-auto hidden dark:block opacity-90 hover:opacity-100 transition-opacity object-contain"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
