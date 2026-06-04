const ASAAS_KEY = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmNjYzExNjIxLWUyYWYtNDc1OC05ZjllLTNhMTQ4Y2UwY2JiNjo6JGFhY2hfY2JmZWJlMGItZmViYy00NjNhLTk0MzctZjM0NmY2NTE4MmY5';
const BASE = 'https://api.asaas.com/v3';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { nome, cpf, telefone, cidade, quantidade, valor } = JSON.parse(event.body);

    // 1. Buscar ou criar cliente
    const cpfLimpo = cpf.replace(/\D/g, '');
    let customerId;

    const busca = await fetch(`${BASE}/customers?cpfCnpj=${cpfLimpo}`, {
      headers: { 'access_token': ASAAS_KEY }
    });
    const buscaData = await busca.json();

    if (buscaData.data && buscaData.data.length > 0) {
      customerId = buscaData.data[0].id;
    } else {
      const criacao = await fetch(`${BASE}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_KEY
        },
        body: JSON.stringify({
          name: nome,
          cpfCnpj: cpfLimpo,
          mobilePhone: telefone.replace(/\D/g, ''),
          address: cidade
        })
      });
      const clienteData = await criacao.json();
      customerId = clienteData.id;
    }

    // 2. Criar cobrança PIX
    const hoje = new Date();
    const vencimento = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
    const dataVenc = vencimento.toISOString().split('T')[0];

    const cobranca = await fetch(`${BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_KEY
      },
      body: JSON.stringify({
        billingType: 'PIX',
        customer: customerId,
        value: parseFloat(valor),
        dueDate: dataVenc,
        description: `Goiás Premiações — ${quantidade} número(s) SW4 Platinum 2026`,
        externalReference: `GP-${Date.now()}`
      })
    });
    const cobrancaData = await cobranca.json();

    // 3. Buscar QR Code
    const qrRes = await fetch(`${BASE}/payments/${cobrancaData.id}/pixQrCode`, {
      headers: { 'access_token': ASAAS_KEY }
    });
    const qrData = await qrRes.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        paymentId: cobrancaData.id,
        qrCodeImage: qrData.encodedImage,
        pixCode: qrData.payload,
        valor: cobrancaData.value,
        status: cobrancaData.status
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
