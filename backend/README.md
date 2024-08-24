# Initial configuration of EC2 instance

## First:

```bash
sudo yum update -y

sudo yum install -y docker python-pip git

sudo service docker start  # Start the Docker Service

sudo usermod -a -G docker ec2-user  # Add the ec2-user to the docker group so you can execute Docker commands without using sudo.
```

Logout and log back in to make the docker group effective.

```bash
curl -sSL https://install.python-poetry.org | python3 -

git clone https://github.com/flick-lang/flick-sandbox

cd flick-sandbox/backend

poetry install --no-root

poetry config virtualenvs.in-project true
```

Then, pull the docker image from AWS Elastic Container Registry:

```bash
# TODO
```

Lastly, install the systemd service that runs the flick sandbox

```bash
sudo systemctl link /home/ec2-user/flick-sandbox/backend/flick-sandbox.service

sudo systemctl daemon-reload  # Reload systemd to recognize the new service

sudo systemctl enable flick-sandbox.service  # Enable the service to start on boot

sudo systemctl start flick-sandbox.service  # Start the service immediately
```
