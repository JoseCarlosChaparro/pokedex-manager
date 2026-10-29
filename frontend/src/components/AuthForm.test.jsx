import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AuthForm from './AuthForm'

describe('AuthForm', () => {
  it('makes the brand the page h1 and the form title an h2', () => {
    render(<AuthForm onAuthenticated={() => {}} toggles={null} />)

    expect(screen.getByRole('heading', { level: 1, name: /PokéDex/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
