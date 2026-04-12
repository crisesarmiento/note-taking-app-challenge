import { expect, test } from '@playwright/test'

const demoEmail = process.env.DEMO_EMAIL ?? 'demo@example.com'
/** Matches Docker Compose default and Playwright when env is unset */
const demoPassword = (process.env.DEMO_PASSWORD ?? 'demo123').trim()

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

async function clearStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.localStorage.clear())
}

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await clearStorage(page)
  await page.getByPlaceholder('Email address').scrollIntoViewIfNeeded()
  await page.getByPlaceholder('Email address').fill(demoEmail)
  await page.getByPlaceholder('Password').fill(demoPassword)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/notes$/)
}

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
    await clearStorage(page)
  })

  test('signs up, lands on notes, shows empty state and default categories', async ({ page }) => {
    const email = uniqueEmail()

    await page.getByPlaceholder('Email address').fill(email)
    await page.getByPlaceholder('Password').fill('strong-pass-123')
    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page).toHaveURL(/\/notes$/)
    await expect(page.getByText('Your tiny thought garden')).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible()
    await expect(page.getByText("I'm just here waiting for your charming notes...")).toBeVisible()

    await expect(page.getByRole('button', { name: 'All Categories' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Random Thoughts/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^School/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Personal/ })).toBeVisible()
  })
})

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await clearStorage(page)
  })

  test('logs in demo user and shows seeded content', async ({ page }) => {
    await page.getByPlaceholder('Email address').fill(demoEmail)
    await page.getByPlaceholder('Password').fill(demoPassword)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/notes$/)
    await expect(page.getByText('Grocery List')).toBeVisible()
  })

  test('logs in after registration with the same credentials', async ({ page }) => {
    const email = uniqueEmail()
    const password = 'strong-pass-123'

    await page.goto('/auth/signup')
    await clearStorage(page)
    await page.getByPlaceholder('Email address').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page).toHaveURL(/\/notes$/)

    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)

    await page.getByPlaceholder('Email address').scrollIntoViewIfNeeded()
    await page.getByPlaceholder('Email address').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page).toHaveURL(/\/notes$/)
    await expect(page.getByText("I'm just here waiting for your charming notes...")).toBeVisible()
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.getByPlaceholder('Email address').fill(demoEmail)
    await page.getByPlaceholder('Password').fill('definitely-not-the-demo-password')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText('Invalid email or password.')).toBeVisible()
  })

  test('shows error for unknown email', async ({ page }) => {
    await page.getByPlaceholder('Email address').fill('nobody-at-all@example.com')
    await page.getByPlaceholder('Password').fill('any-password-here-12')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText('Invalid email or password.')).toBeVisible()
  })
})

test.describe('Notes CRUD, categories, and filters', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
  })

  test('creates a note, edits with autosave, changes category, and appears on the list', async ({ page }) => {
    const noteTitle = `E2E Cozy Note ${Date.now()}`
    const noteContent = 'This note was edited by Playwright and saved through the debounced editor.'

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
  })

  test('filters by All, Random Thoughts, School, and Personal', async ({ page }) => {
    const noteTitle = `E2E Filter Note ${Date.now()}`

    await page.getByRole('button', { name: 'New Note' }).click()
    await expect(page).toHaveURL(/\/notes\/\d+$/)
    await page.getByPlaceholder('Note Title').fill(noteTitle)
    await page.getByPlaceholder('Pour your heart out...').fill('filter-me')
    await expect(page.getByTestId('save-status')).toHaveText('Saved')

    await page.getByRole('button', { name: 'Change category' }).click()
    await page.getByRole('menuitem', { name: /School/ }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Saved')
    await page.getByRole('button', { name: 'Close editor' }).click()
    await expect(page).toHaveURL(/\/notes$/)

    await page.getByRole('button', { name: 'All Categories' }).click()
    await expect(page.getByRole('link').filter({ hasText: noteTitle })).toBeVisible()
    await expect(page.getByText('Grocery List')).toBeVisible()

    await page.getByRole('button', { name: /^Random Thoughts/ }).click()
    await expect(page.getByText('Grocery List')).toBeVisible()
    await expect(page.getByRole('link').filter({ hasText: noteTitle })).toHaveCount(0)

    await page.getByRole('button', { name: /^School/ }).click()
    await expect(page.getByRole('link').filter({ hasText: noteTitle })).toBeVisible()
    await expect(page.getByText('Grocery List')).toHaveCount(0)

    await page.getByRole('button', { name: /^Personal/ }).click()
    await expect(page.getByText('Books to Read')).toBeVisible()
    await expect(page.getByRole('link').filter({ hasText: noteTitle })).toHaveCount(0)
  })
})

test.describe('Session and auth guard', () => {
  test('logout returns to login and blocks /notes until signup redirect', async ({ page }) => {
    await loginAsDemo(page)

    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)

    await page.goto('/notes')
    await expect(page).toHaveURL(/\/auth\/signup$/)
  })

  test('unauthenticated visit to /notes redirects to signup', async ({ page }) => {
    await page.goto('/auth/login')
    await clearStorage(page)
    await page.goto('/notes')
    await expect(page).toHaveURL(/\/auth\/signup$/)
  })
})

test.describe('Relative dates on cards', () => {
  test('shows today for a newly saved note', async ({ page }) => {
    await loginAsDemo(page)
    const noteTitle = `E2E Dated ${Date.now()}`

    await page.getByRole('button', { name: 'New Note' }).click()
    await expect(page).toHaveURL(/\/notes\/\d+$/)
    await page.getByPlaceholder('Note Title').fill(noteTitle)
    await page.getByPlaceholder('Pour your heart out...').fill('dated')
    await expect(page.getByTestId('save-status')).toHaveText('Saved')
    await page.getByRole('button', { name: 'Close editor' }).click()

    const card = page.getByRole('link').filter({ hasText: noteTitle })
    await expect(card).toBeVisible()
    await expect(card.getByText('today', { exact: true })).toBeVisible()
  })
})

test.describe('Responsive layout', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('notes list and editor remain usable on a narrow viewport', async ({ page }) => {
    await loginAsDemo(page)

    await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Categories' })).toBeVisible()

    await page.getByRole('button', { name: 'New Note' }).click()
    await expect(page).toHaveURL(/\/notes\/\d+$/)
    await expect(page.getByPlaceholder('Note Title')).toBeVisible()
    await expect(page.getByPlaceholder('Pour your heart out...')).toBeVisible()
    await page.getByRole('button', { name: 'Change category' }).click()
    await expect(page.getByRole('menuitem', { name: /Personal/ })).toBeVisible()
  })
})
