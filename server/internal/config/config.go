package config

type Config struct {
	Port string
}

func Load() (*Config, error) {
	return &Config{
		Port: "8080",
	}, nil
}
