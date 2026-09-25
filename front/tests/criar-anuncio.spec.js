import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'

async function prepararCriacao(page, step = 1) {
  await page.addInitScript(({ etapa }) => {
    localStorage.setItem('token', 'token-de-teste')
    localStorage.setItem('usuarioLogado', 'true')
    localStorage.setItem('dadosUsuario', JSON.stringify({ id: 'usuario-criacao', nome: 'Pessoa Anunciante', objetivo: 'ambos' }))
    if (etapa > 1) window.history.replaceState({ idx: 0, key: 'teste', usr: { step: etapa } }, '')
  }, { etapa: step })

  await page.route('**/api/usuarios/usuario-criacao/verificacao', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'aprovado' }) })
  })
}

test.describe('Criar anúncio', () => {
  const validacoesPorEtapa = [
    {
      nome: 'detalhes incompletos',
      step: 1,
      mensagem: 'Preencha um título, uma descrição com pelo menos 20 caracteres e uma categoria.',
      agir: async (page) => page.getByRole('button', { name: 'Próximo', exact: true }).click(),
    },
    {
      nome: 'especificação sem nome',
      step: 2,
      mensagem: 'Preencha o nome da especificação ou remova a linha incompleta.',
      agir: async (page) => {
        await page.getByRole('button', { name: '+ Adicionar especificação' }).click()
        await page.getByPlaceholder('ex: 220V').fill('220V')
        await page.getByRole('button', { name: 'Próximo', exact: true }).click()
      },
    },
    {
      nome: 'menos de três fotos',
      step: 3,
      mensagem: 'Adicione pelo menos 3 fotos do item antes de continuar.',
      agir: async (page) => page.getByRole('button', { name: 'Próximo', exact: true }).click(),
    },
    {
      nome: 'localização incompleta',
      step: 4,
      mensagem: 'Preencha todos os campos obrigatórios da localização.',
      agir: async (page) => page.getByRole('button', { name: 'Próximo', exact: true }).click(),
    },
    {
      nome: 'nenhum dia disponível',
      step: 5,
      mensagem: 'Selecione pelo menos um dia disponível.',
      agir: async (page) => page.getByRole('button', { name: 'Próximo', exact: true }).click(),
    },
    {
      nome: 'preço inválido',
      step: 6,
      mensagem: 'Informe um preço diário válido e uma caução não negativa. Se exigir caução, ela deve ser maior que zero.',
      agir: async (page) => page.getByRole('button', { name: 'Concluir' }).click(),
    },
  ]

  for (const caso of validacoesPorEtapa) {
    test(`impede avanço com ${caso.nome}`, async ({ page }) => {
      await prepararCriacao(page, caso.step)
      await page.goto('/criar-anuncio')
      await caso.agir(page)
      await expect(page.getByText(caso.mensagem)).toBeVisible()
      await expect(page.getByText(`Etapa ${caso.step} de 7`).first()).toBeVisible()
    })
  }

  test('usa o espaço de monitores grandes e atualiza a prévia em tempo real', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await prepararCriacao(page)
    await page.goto('/criar-anuncio')

    await expect(page.getByRole('heading', { name: 'Criar anúncio', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Prévia do anúncio' })).toBeVisible()

    await page.getByLabel('Título').fill('Furadeira profissional Bosch')
    await expect(page.getByRole('heading', { name: 'Furadeira profissional Bosch' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('mantém progresso e formulário claros no celular', async ({ page }) => {
    await prepararCriacao(page)
    await page.goto('/criar-anuncio')

    await expect(page.getByText('Etapa 1 de 7').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Detalhes', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Prévia do anúncio' })).toBeHidden()
    await expect(page.getByLabel('Título')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('aceita CEP colado com hífen e preenche o endereço', async ({ page }) => {
    await prepararCriacao(page, 4)
    await page.route('**/api/cep/v1/01001000', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' }) })
    })
    await page.goto('/criar-anuncio')

    await page.getByLabel('CEP').fill('01001-000')
    await expect(page.getByLabel('Rua')).toHaveValue('Praça da Sé')
    await expect(page.getByLabel('Cidade')).toHaveValue('São Paulo')
    await expect(page.getByLabel('Estado')).toHaveValue('SP')
  })

  test('sincroniza o número ao reposicionar o mapa', async ({ page }) => {
    await prepararCriacao(page, 4)
    await page.route('**/reverse?**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ address: { postcode: '01001-000', road: 'Praça da Sé', house_number: '321', suburb: 'Sé', city: 'São Paulo', 'ISO3166-2-lvl4': 'BR-SP' } }) })
    })
    await page.route('**/search?**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ lat: '-23.5505', lon: '-46.6333' }]) })
    })
    await page.goto('/criar-anuncio')

    await page.locator('.leaflet-container').click({ position: { x: 220, y: 110 } })
    await expect(page.getByLabel('Número')).toHaveValue('321')
    await expect(page.getByText('Endereço atualizado pelo mapa: número 321.')).toBeVisible()
  })

  test('calendário bloqueia o passado, seleciona e limpa datas', async ({ page }) => {
    await prepararCriacao(page, 5)
    await page.goto('/criar-anuncio')

    await expect(page.getByRole('heading', { name: 'Disponibilidade', exact: true }).first()).toBeVisible()
    const diaDisponivel = page.locator('.calendario-criacao .rdp-day_button:not([disabled])').first()
    await diaDisponivel.click()
    await expect(page.getByText('1 dia selecionado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar seleção' }).click()
    await expect(page.getByText('0 dias selecionados')).toBeVisible()
  })

  test('conclui os sete passos, salva rascunho e publica o mesmo anúncio', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await prepararCriacao(page)

    const requisicoes = []
    await page.route('**/api/cep/v1/01001000', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' }) })
    })
    await page.route('**/search?**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ lat: '-23.5505', lon: '-46.6333' }]) })
    })
    await page.route('**/api/upload', async (route) => {
      const corpo = route.request().postData() || ''
      expect((corpo.match(/name="fotos"/g) || []).length).toBe(3)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ urls: ['https://img.test/1.png', 'https://img.test/2.png', 'https://img.test/3.png'] }) })
    })
    await page.route('**/api/anuncios', async (route) => {
      const dados = route.request().postDataJSON()
      requisicoes.push({ metodo: route.request().method(), dados })
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ anuncio: { _id: 'anuncio-e2e', ...dados } }) })
    })
    await page.route('**/api/anuncios/anuncio-e2e', async (route) => {
      const dados = route.request().postDataJSON()
      requisicoes.push({ metodo: route.request().method(), dados })
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ anuncio: { _id: 'anuncio-e2e', ...dados } }) })
    })

    await page.goto('/criar-anuncio')

    // 1. Detalhes
    await page.getByLabel('Título').fill('Furadeira Bosch profissional')
    await page.getByLabel('Descrição').fill('Furadeira de impacto revisada, acompanha maleta, brocas e empunhadura lateral.')
    await page.getByLabel('Categoria', { exact: true }).selectOption('ferramentas')
    await page.getByLabel('Subcategorias').fill('Furadeira de impacto')
    await page.getByRole('button', { name: '+' }).click()
    await page.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Especificações do Item' })).toBeVisible()

    // 2. Especificações
    await page.getByPlaceholder('ex: 220V').first().fill('220V')
    await page.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Fotos do Anúncio' })).toBeVisible()

    // 3. Fotos
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
    await page.locator('input[type="file"]').setInputFiles([
      { name: 'frente.png', mimeType: 'image/png', buffer: png },
      { name: 'lateral.png', mimeType: 'image/png', buffer: png },
      { name: 'detalhe.png', mimeType: 'image/png', buffer: png },
    ])
    await expect(page.getByText('3/6 fotos')).toBeVisible()
    await page.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Localização', exact: true }).first()).toBeVisible()

    // 4. Localização
    await page.getByLabel('CEP').fill('01001-000')
    await expect(page.getByLabel('Rua')).toHaveValue('Praça da Sé')
    await page.getByLabel('Número').fill('100')
    await expect(page.locator('.leaflet-marker-icon')).toBeVisible()
    await page.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Disponibilidade', exact: true }).first()).toBeVisible()

    // 5. Disponibilidade
    await page.locator('.calendario-criacao .rdp-day_button:not([disabled])').first().click()
    await expect(page.getByText('1 dia selecionado')).toBeVisible()
    await page.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Preços e Condições' })).toBeVisible()

    // 6. Preço e condições
    await page.getByLabel('Preço por dia').fill('75')
    await page.getByLabel('Caução (Opcional)').fill('250')
    await page.getByLabel('Exigir caução').check()
    await page.getByLabel('Hora de horário de retirada').selectOption('10')
    await page.getByRole('button', { name: 'Concluir' }).click()
    await expect(page.getByRole('heading', { name: 'Revise seu anúncio' })).toBeVisible()

    // 7. Rascunho e publicação
    await page.getByRole('button', { name: 'Salvar como rascunho' }).click()
    await expect(page.getByRole('heading', { name: 'Rascunho salvo!' })).toBeVisible()
    await page.getByRole('button', { name: 'Continuar editando' }).click()
    await page.getByRole('button', { name: 'Publicar Anúncio' }).click()
    await expect(page.getByRole('heading', { name: 'Anúncio publicado!' })).toBeVisible()

    expect(requisicoes).toHaveLength(2)
    expect(requisicoes[0].metodo).toBe('POST')
    expect(requisicoes[0].dados.status).toBe('rascunho')
    expect(requisicoes[1].metodo).toBe('PUT')
    expect(requisicoes[1].dados.status).toBe('publicado')
    expect(requisicoes[1].dados.fotos).toHaveLength(3)
    expect(requisicoes[1].dados.locador).toBe('usuario-criacao')
    expect(requisicoes[1].dados.precos).toMatchObject({ precoPorDia: '75', caucao: '250', exigirCaucao: true, horarioRetirada: '10:00' })
  })
})
