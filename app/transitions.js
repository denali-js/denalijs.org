export default function(){

  this.transition(
    this.hasClass('active-comparison'),
    this.use('slotFromLeft')
  );
  
}
