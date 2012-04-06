class ChangeDataTypeForPageContent < ActiveRecord::Migration
  
  def up
    change_table :pages do |t|
          t.change :content, :text
        end
  end

  def down
    change_table :pages do |t|
          t.change :content, :string
        end
  end
end
