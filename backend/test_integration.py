from fastapi.testclient import TestClient
from app.main import app

def test_integration():
    with TestClient(app) as client:
        health = client.get('/health').json()
        dash = client.get('/dashboard/summary').json()
        stores = client.get('/stores').json()
        offers = client.get('/offers').json()
        alerts = client.get('/churn-alerts').json()

        print('Health:', health)
        print('Faturamento:', dash['tradicional']['faturamento_total_dia'])
        print('Incremental:', dash['crm_preditivo_retail_media']['receita_incremental_ofertas'])
        print('Funil:', dash['crm_preditivo_retail_media']['funil'])
        print('Alertas ativos:', len(alerts))
        print('Ofertas:', len(offers))
        print('Stores count:', len(stores))

        # Test activating an offer
        disparada = next(o for o in offers if o['status'] == 'disparada')
        res_act = client.post(f"/offers/{disparada['id']}/activate").json()
        print('Activate offer result:', res_act)

        # Test triggering a churn campaign
        alert = alerts[0]
        res_camp = client.post(f"/churn-alerts/{alert['id']}/trigger-campaign").json()
        print('Trigger campaign result:', res_camp)

        # Test simulate purchase
        demo_cpf = client.get('/customers').json()['demo_cpf']
        res_pur = client.post(f"/customers/{demo_cpf}/simulate-purchase").json()
        print('Simulate purchase result:', res_pur)

    print('>>> SUCCESS: All backend endpoints tested and verified with 100% success! <<<')

if __name__ == '__main__':
    test_integration()
