desc "load pages from backpack"
task :loadpages => :environment do

  require 'mechanize'
  require 'nokogiri'
  require 'open-uri'
  require 'uri'

  # def make_absolute( href, root )
  #   URI.parse(root).merge(URI.parse(href)).to_s
  # end

  Page.destroy_all
  agent = Mechanize.new
  agent.get('https://codeacademy.backpackit.com/pages') do |page|

    # Submit the login form
    my_page = page.form_with(:action => "https://launchpad.37signals.com/authenticate") do |f|
      f.username = BP_USERNAME
      f.password = BP_PASSWORD
    end.click_button

    my_page.links_with(:class => "link_to_page ").each do |link|

      show_page = agent.get("https://codeacademy.backpackit.com#{link.uri}") do |next_page|
        p = Page.new
        p.title = next_page.search('div#page_title').at_css('h1').text
        p.content = next_page.search('#main_column').to_xhtml
        p.save
        # next_page.search("//img/@src").each do |src|
        #             uri = make_absolute(src, "https://codeacademy.backpackit.com/images")
        #             File.open(File.basename(uri),'wb'){ |f| f.write(open(uri).read) }
        #           end


        # pdflink = next_page.links_with(:href => /\.pdf/ ).first
        #        page = agent.click(pdflink)
        # 
        #        File.open(page.filename.gsub("/","_"), 'w+b') do |file|
        #             file << page.body.strip 



        # next_page.search("a").each do |pdflink|
        #           if pdflink['href'] == /\.pdf/
        #               File.open("https://codeacademy.backpackit.com#{pdflink['href']}", 'w') do |file|
        #                 downloaded_file = open(pdflink['href'])
        #                 file.write(downloaded_file.read())
        #                 puts "downloaded #{downloaded_file}"
              # end
              #    end
        # end
    end 
  end

end

end