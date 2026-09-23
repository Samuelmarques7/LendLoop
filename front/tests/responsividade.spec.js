import { expect, test } from '@playwright/test';

test.describe('Experiência mobile', () => {
  test('a home carrega sem rolagem horizontal e exibe buscas populares', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /O que você precisa, por perto/i })).toBeVisible();

    const campoBusca = page.getByRole('textbox', { name: 'Buscar itens para alugar' });
    await campoBusca.focus();

    await expect(page.getByText('Mais procurados')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Furadeira' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('o menu da conta mantém os atalhos acessíveis no celular', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('usuarioLogado', 'true');
      localStorage.setItem('dadosUsuario', JSON.stringify({ id: 'teste-mobile', nome: 'Usuário Mobile', objetivo: 'ambos' }));
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menu' }).click();

    await expect(page.getByRole('button', { name: /Painel locatário/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Painel locador/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Configurações/i })).toBeVisible();
  });
});
