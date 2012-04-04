BackpackScraper::Application.routes.draw do

  get 'pages/practice'
  resources :pages
  root :to => "pages#index"
end
