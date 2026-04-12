import { expect, test } from '@playwright/test'

const demoEmail = process.env.DEMO_EMAIL ?? 'demo@example.com'
const demoPassword = process.env.DEMO_PASSWORD ?? ''

test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login')
  await page.evaluate(() => window.localStorage.clear())
})

test('registers a new user and lands on notes', async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`

  await page.goto('/auth/signup')
  await page.getByPlaceholder('Email address').fill(email)
  await page.getByPlaceholder('Password').fill('strong-pass-123')
  await page.getByRole('button', { name: 'Sign Up' }).click()

  await expect(page).toHaveURL(/\/notes$/)
  await expect(page.getByText('Your tiny thought garden')).toBeVisible()
  await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible()
})

test('demo user can create, edit, filter, and logout', async ({ page }) => {
  test.skip(!demoPassword, 'DEMO_PASSWORD is required for demo-user E2E coverage.')

  const noteTitle = `E2E Cozy Note ${Date.now()}`
  const noteContent = 'This note was edited by Playwright and saved through the debounced editor.'

  await page.goto('/auth/login')
  await page.getByPlaceholder('Email address').fill(demoEmail)
  await page.getByPlaceholder('Password').fill(demoPassword)
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page).toHaveURL(/\/notes$/)
  await expect(page.getByText('Grocery List')).toBeVisible()

  await page.getByRole('button', { name: 'New Note' }).click()
  await expect(page).toHaveURL(/\/notes\/\d+$/)

  await page.getByPlaceholder('Note Title').fill(noteTitle)
  await page.getByPlaceholder('Pour your heart out...').fill(noteContent)
  await expect(page.getByTestId('save-status')).toHaveText('Saved')

  await page.getByRole('button', { name: 'Change category' }).click()
  await page.getByRole('menuitem', { name: /School/ }).click()
  await expect(page.getByRole('button', { name: 'Change category' })).toContainText('School')
  await expect(page.getByTestId('save-status')).toHaveText('Saved')

  await page.getByRole('button', { name: 'Close editor' }).click()
  await expect(page).toHaveURL(/\/notes$/)
  const updatedCard = page.getByRole('link').filter({ hasText: noteTitle })
  await expect(updatedCard).toBeVisible()
  await expect(updatedCard).toContainText(noteContent)

  await page.getByRole('button', { name: /^School/ }).click()
  await expect(page.getByRole('link').filter({ hasText: noteTitle })).toBeVisible()
  await expect(page.getByText('Grocery List')).toHaveCount(0)

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)

  await page.goto('/notes')
  await expect(page).toHaveURL(/\/auth\/signup$/)
})
