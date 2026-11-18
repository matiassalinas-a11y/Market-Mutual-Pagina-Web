'use client'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './admin.module.css'
export function AdminDialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-labelledby="admin-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className={styles.modalHeader}>
        <h2 id="admin-dialog-title">{title}</h2>
        <button
          className={styles.iconButton}
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  )
}
