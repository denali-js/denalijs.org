export default function(){
  this.transition(
    this.toRoute('docs.apis'),
    this.use('toUp'),
    this.debug()
  );
}
