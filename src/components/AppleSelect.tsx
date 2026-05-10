import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
  value: string
  label: string
}

interface AppleSelectProps {
  isOpen: boolean
  onClose: () => void
  options: Option[]
  value: string
  onChange: (value: string) => void
  title: string
}

export default function AppleSelect({ isOpen, onClose, options, value, onChange, title }: AppleSelectProps) {
  const portalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300, mass: 0.8 }}
            className="relative w-full max-w-lg bg-[#1C1C1E] border-t border-white/5 sm:border sm:border-white/10 rounded-t-[32px] sm:rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 bg-white/10 rounded-full" />
            </div>

            <div className="px-6 py-4 flex justify-between items-center border-b border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-text-sub uppercase tracking-[0.25em]">Voyage Picker</span>
                <span className="text-lg font-medium text-white">{title}</span>
              </div>
              <button 
                onClick={onClose}
                className="text-[#0A84FF] text-[17px] font-semibold px-4 py-2 rounded-xl active:bg-white/5 active:scale-95 transition-all"
              >
                完成
              </button>
            </div>

            <div className="px-4 py-6 max-h-[40vh] overflow-y-auto no-scrollbar bg-[#1C1C1E]">
              <div className="space-y-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value)
                      onClose()
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${
                      value === option.value 
                        ? 'bg-white/10 text-white' 
                        : 'text-text-sub hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base font-medium">{option.label}</span>
                    {value === option.value && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-[#0A84FF] rounded-full shadow-[0_0_10px_#0A84FF]"
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="h-8" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(portalContent, document.body)
}
