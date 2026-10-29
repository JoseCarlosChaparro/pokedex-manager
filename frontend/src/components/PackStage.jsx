import { createPortal } from 'react-dom'

// Full-screen layer for the opening sequence. It sits in <body> so it stacks above the gallery, and it stays
// empty (hidden by `empty:hidden`) until playPackOpening appends the elements it animates.
export default function PackStage({ stageRef }) {
  return createPortal(
    <div ref={stageRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 empty:hidden" />,
    document.body,
  )
}
