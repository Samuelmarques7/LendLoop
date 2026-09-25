import { expect, test } from '@playwright/test';
import { Buffer } from 'node:buffer';

const USUARIO = {
  id: 'usuario-configuracoes',
  nome: 'Pessoa de Teste',
  email: 'teste@lendloop.com',
  objetivo: 'ambos',
  verificacao: { status: 'nao_enviado' },
};

async function prepararSessao(page) {
  await page.addInitScript((usuario) => {
    localStorage.setItem('token', 'token-configuracoes');
    localStorage.setItem('usuarioLogado', 'true');
    localStorage.setItem('dadosUsuario', JSON.stringify(usuario));
  }, USUARIO);

  await page.route('**/api/notificacoes/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ quantidade: 0, notificacoes: [] }),
  }));
}

async function mockStatusKyc(page, status = 'nao_enviado') {
  await page.route('**/api/usuarios/usuario-configuracoes/verificacao', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status }) });
      return;
    }
    await route.fallback();
  });
}

test.beforeEach(async ({ page }) => {
  await prepararSessao(page);
  await mockStatusKyc(page);
});

test('carrega a sessão salva sem mostrar o estado de usuário desconectado', async ({ page }) => {
  await page.goto('/configuracoes');
  await expect(page.getByRole('heading', { name: 'Configurações da conta' })).toBeVisible();
  await expect(page.getByText('Faça login para gerenciar sua conta')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Verificação de identidade' })).toBeVisible();
});

test('altera a preferência, persiste localmente e confirma o sucesso', async ({ page }) => {
  await page.route('**/api/usuarios/usuario-configuracoes', async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ usuario: { objetivo: body.objetivo } }),
    });
  });

  await page.goto('/configuracoes');
  const opcao = page.getByRole('button', { name: /Apenas Alugar/i });
  await opcao.click();

  await expect(opcao).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Preferência atualizada com sucesso.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('dadosUsuario')).objetivo)).toBe('locatario');
});

test('valida CPF e arquivos antes de enviar o KYC', async ({ page }) => {
  let requisicoesPost = 0;
  await page.route('**/api/usuarios/usuario-configuracoes/verificacao', async (route) => {
    if (route.request().method() === 'POST') requisicoesPost += 1;
    await route.fallback();
  });

  await page.goto('/configuracoes');
  await page.getByLabel('CPF').fill('11111111111');
  const inputs = page.locator('input[type="file"]');
  for (let indice = 0; indice < 3; indice += 1) {
    await inputs.nth(indice).setInputFiles({ name: `foto-${indice}.png`, mimeType: 'image/png', buffer: Buffer.from('imagem') });
  }
  await page.getByRole('button', { name: 'Enviar para análise' }).click();

  await expect(page.getByText('Informe um CPF válido.')).toBeVisible();
  expect(requisicoesPost).toBe(0);
});

test('envia documentos válidos e muda o KYC para pendente', async ({ page }) => {
  await page.route('**/api/usuarios/usuario-configuracoes/verificacao', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verificacao: { status: 'pendente' } }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto('/configuracoes');
  await page.getByLabel('CPF').fill('52998224725');
  const inputs = page.locator('input[type="file"]');
  for (let indice = 0; indice < 3; indice += 1) {
    await inputs.nth(indice).setInputFiles({ name: `foto-${indice}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.from('imagem') });
  }
  await page.getByRole('button', { name: 'Enviar para análise' }).click();

  await expect(page.getByRole('heading', { name: 'Documentação em Análise' })).toBeVisible();
  await expect(page.getByText('Documentos enviados para análise.')).toBeVisible();
});

test('mantém a conta ativa quando o backend bloqueia a exclusão', async ({ page }) => {
  await page.route('**/api/usuarios/usuario-configuracoes', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ erro: 'Sua conta não pode ser encerrada enquanto houver aluguéis em aberto.' }),
    });
  });

  await page.goto('/configuracoes');
  await page.getByRole('button', { name: 'Excluir Conta' }).click();
  const modal = page.getByRole('alertdialog');
  await modal.getByRole('button', { name: 'Excluir conta' }).click();

  await expect(page).toHaveURL(/\/configuracoes$/);
  await expect(page.getByText('Sua conta não pode ser encerrada enquanto houver aluguéis em aberto.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBe('token-configuracoes');
});
