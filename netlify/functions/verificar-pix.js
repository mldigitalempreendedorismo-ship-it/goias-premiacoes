const ASAAS_KEY = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmNjYzExNjIxLWUyYWYtNDc1OC05ZjllLTNhMTQ4Y2UwY2JiNjo6JGFhY2hfY2JmZWJlMGItZmViYy00NjNhLTk0MzctZjM0NmY2NTE4MmY5';

exports.handler = async (event) => {
  const paymentId = event.queryStringParameters?.id;
  if (!paymentId) return { statusCode: 400, body: 'Missing id' };

  try {
    const res = await fetch(`https://api.asaas.com/v3/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_KEY }
    });
    const data = await res.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: data.status })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
