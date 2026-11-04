def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_job_rejects_more_than_three_thumbnails(client):
    response = client.post(
        "/api/jobs",
        json={"prompt": "A video about testing", "num_thumbnails": 4, "headshot_url": ""},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "num_thumbnails must be between 1 and 3"


def test_create_job_rejects_zero_thumbnails(client):
    response = client.post(
        "/api/jobs",
        json={"prompt": "A video about testing", "num_thumbnails": 0, "headshot_url": ""},
    )

    assert response.status_code == 400


def test_get_missing_job_returns_404(client):
    response = client.get("/api/jobs/missing-job")

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"
